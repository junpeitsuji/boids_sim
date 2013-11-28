$(function() {

	// コンテキストを取得する関数
	function getCtx() {
		var canvas = document.getElementById('canvas');
		return canvas.getContext('2d');
    };

    // グローバル変数の初期化
	var width  = canvas.width;
	var height = canvas.height;
	var canvasRect = canvas.getBoundingClientRect()

	// 敵キャラ
	var enemies = new Array(2);

	var Enemy = (function(){
		//画像オブジェクト
		var img = new Image();
		//画像のパス指定
		img.src = "images/enemy.png";

		function Enemy(id, x, y, radious) {
			this.id = id;
			this.x  = x;
			this.y  = y;
			this.radious = radious; // 当たり判定用半径
		}

		Enemy.prototype.update = function(){
			var dx = Math.random()*40 - 20;
			var dy = Math.random()*40 - 20;

			if( this.x+dx > 0 && this.x+dx < width 
				&& this.y+dy > 0 && this.y+dy < height ){
				this.x += dx;
				this.y += dy;
				
			}
		}

		Enemy.prototype.draw = function(ctx){
	    	//canvasの状態を一旦保存
	    	ctx.save();

    		var image_width  = img.naturalWidth;
    		var image_height = img.naturalHeight;
    	
	    	//ctx.scale(ratio, ratio);
		    //画像の縦横半分の位置へtranslate
	    	ctx.translate(this.x-image_width/2 + image_width/2, this.y- image_height/2 +image_height/2);
			
			//translateした分戻して原点を0，0に
	    	ctx.translate(-image_width/2, -image_height/2);

	    	//読み込んだimgをcanvas(c1)に貼付け
	    	ctx.drawImage(img, 0, 0);
    		
    		//canvasの状態を元に戻す
    		ctx.restore();
		}

		return Enemy;

	})();

	// 敵キャラの初期化
	enemies[0] = new Enemy(0, 100, 100, 60);
	enemies[1] = new Enemy(1, 500, 400, 60);


	// ターゲット
	var Target = (function(){
		/*
		//画像オブジェクト
		var img = new Image();
		//画像のパス指定
		img.src = "images/target.png";
		*/
		function Target(x, y) {
			this.x = x;
			this.y = y;
		}

		Target.prototype.draw = function(ctx){
	    	//canvasの状態を一旦保存
	    	ctx.save();

			ctx.fillStyle = 'rgba(0, 80, 192, 0.7)';
			ctx.beginPath();
			ctx.arc(this.x, this.y, 20, 0, Math.PI*2, false);
			ctx.fill();	
    		
    		//canvasの状態を元に戻す
    		ctx.restore();
		}

		return Target;

	})();

	// ターゲットの初期化
	var target = new Target(
		width/2,   // x
		height*4/5 // y
	);

	// ゲーム状態
	const GAME_CONTEXT_FLAG_GAMERUNNING = 0;
	const GAME_CONTEXT_FLAG_GAMEOVER    = 1;
	var gameContextFlag = GAME_CONTEXT_FLAG_GAMERUNNING; 

	// ゲームスコア
	var score = 0;

	var appearingEnemy = 0;

	// 制限速度
	var MAXSPEED = 5;
	
	// boid の個体数
	var numOfBoids = 100;

	var numOfBoidsRemaining = 100;

	// boid の個体を管理する配列
	var boids = new Array(numOfBoids);

// /*
	var Boid = (function(){
		//画像オブジェクト
		var img = new Image();
		//画像のパス指定
		img.src = "images/boid.png";


		function Boid(id, x, y, vx, vy, alive) {
			this.id = id;
			this.x  = x;
			this.y  = y;
			this.vx = vx;
			this.vy = vy;
			this.alive = alive;
		}

		Boid.prototype.update = function(){
			if( this.alive ){
				this.rule1();
				this.rule2();
				this.rule3();
				this.rule4();
				this.rule5();

				// 速さを制限する
		    	var velocity = Math.sqrt( this.vx * this.vx + this.vy * this.vy );
		    	if( velocity > MAXSPEED ){
		    		this.vx *= MAXSPEED / velocity;
		    		this.vy *= MAXSPEED / velocity; 
		    	}

			    // 位置の更新
			    this.x += this.vx;
			    this.y += this.vy;
			}
		}

		Boid.prototype.rule1 = function(){ // すべてのBoidは群の中心に向かおうとする
			var cx = 0;
			var cy = 0;
			
			var aliveCount = 0;  // 生きている boid の数を数える

			for( var j = 0; j < numOfBoids; j++ ){
				if( this.id != j ){

					if( boids[j].alive ){
						cx += boids[ j ].x;
						cy += boids[ j ].y;

						aliveCount++;
					}

				}
			}

			// 残りの boids の数が 2 以上のととき
			if( aliveCount > 1 ){

				cx /= aliveCount - 1;
				cy /= aliveCount - 1;

				this.vx += ( cx - this.x ) / 1000;
				this.vy += ( cy - this.y ) / 1000;

			}
		}

		Boid.prototype.rule2 = function(){ // 他の個体と距離をとろうとする
			var vx = 0;
			var vy = 0;

			for( var j = this.id + 1; j < numOfBoids; j++ ){

				if( boids[j].alive ){

					var dx = boids[ j ].x - this.x;
					var dy = boids[ j ].y - this.y;

					var dist = Math.sqrt( dx * dx + dy * dy );
					if( dist < 15 ){
						dist += 0.001;

						vx -= dx / dist;
						vy -= dy / dist;
					}

				}
			}

			this.vx += vx;
			this.vy += vy;
		}
		Boid.prototype.rule3 = function(){ // 他の個体と向きと速度を合わせようとする
			var pvx = 0;
			var pvy = 0;

			var aliveCount = 0;  // 生きている boids の数

			for( var j = 0; j < numOfBoids; j++ ){
				if( this.id != j ){

					if( boids[j].alive ){
						pvx += boids[ j ].vx;
						pvy += boids[ j ].vy;

						aliveCount++;
					}

				}
			}

			// 残りの boids の数が 2 以上のととき
			if( aliveCount > 1 ) {
				pvx /= aliveCount - 1;
				pvy /= aliveCount - 1;

				this.vx += ( pvx - this.vx ) / 10;
	  			this.vy += ( pvy - this.vy ) / 10;
			}
			
		}
		Boid.prototype.rule4 = function(){ // 移動領域を限定する
			// 壁の近くでは方向反転
			if( this.x < 10 && this.vx < 0 ){
				this.vx += 10 / ( Math.abs( this.x  ) + 1 );
			} 
			else if( this.x > width - 10 && this.vx > 0 ){
				this.vx -= 10 / ( Math.abs( width - this.x ) + 1 );
			}

			if( this.y < 10 && this.vy < 0 ){
				this.vy += 10 / ( Math.abs( this.y  ) + 1 );
			}
			else if( this.y > height - 10 && this.vy > 0 ){
				this.vy -= 10 / ( Math.abs( height - this.y ) + 1 );
			}
  
		}
		Boid.prototype.rule5 = function(){
			var dx = target.x - this.x;
			var dy = target.y - this.y;

			var dist = Math.sqrt( dx * dx + dy * dy );

			this.vx += ( target.x - this.x ) / 500;
			if( this.vx * ( target.x - this.x ) < 0 ){
				this.vx += ( target.x - this.x ) / 500;
			}
			this.vy += ( target.y - this.y ) / 500;
			if( this.vy * ( target.y - this.y ) < 0 ){
				this.vy += ( target.y - this.y ) / 500;
			}
		}

		Boid.prototype.draw = function(ctx){

			if( this.alive ){
				var rad = Math.atan2(this.vy, this.vx);

		    	//canvasの状態を一旦保存
		    	ctx.save();

		 		var image_width  = img.naturalWidth;
	    		var image_height = img.naturalHeight;
	    	
			    //画像の縦横半分の位置へtranslate
		    	ctx.translate(this.x-image_width/2 + image_width/2, this.y- image_height/2 +image_height/2);
		    	//変形マトリックスに回転を適用
		    	ctx.rotate(rad);

				//translateした分戻して原点を0，0に
		    	ctx.translate(-image_width/2, -image_height/2);

			    //読み込んだimgをcanvas(c1)に貼付け
			    ctx.drawImage(img, 0, 0);
	    		//canvasの状態を元に戻す
	    		ctx.restore();

			}

		}

		return Boid;

	})();
// */

	// 初期処理
	for(var i=0; i<numOfBoids; i++){
		boids[i] = new Boid(
			i          // id
			, width/2  // x
			, height/2 // y
			, 0        // vx
			, 0        // vy
			, true     // alive
		);
	}

	// 	メインの実行
	main();

	// クリック処理
	$('canvas').click( function(event){
		target.x = event.pageX - canvasRect.left;
		target.y = event.pageY - canvasRect.top;

	});

	// ここからメイン
	function main(){
		var ctx = getCtx();
		ctx.clearRect(0, 0, width, height);
	
		draw();
		update();			

		// 当たり判定
		collisionDetection();

		$('#score').text(score);
		$('#boids').text(numOfBoidsRemaining);

		if( gameContextFlag == GAME_CONTEXT_FLAG_GAMERUNNING ){

			score += 100;
			appearingEnemy += 100;

			if(appearingEnemy > 100000){
				enemies.push(new Enemy(
					enemies.length,         // id
					width  * Math.random(), // x
					height * Math.random(), // y
					60                      // radious 
				));
				appearingEnemy = 0;
			}
			setTimeout( main, 20 );			

		}
		else if( gameContextFlag == GAME_CONTEXT_FLAG_GAMEOVER ) {
	    	//canvasの状態を一旦保存
	    	ctx.save();

			// Game Over
			var text = "Game Over";
			
			ctx.font = "72px 'ＭＳ Ｐゴシック'";
			ctx.fillStyle = "#b00";
			ctx.fillText(text, width/2 - 180, height/2);
			ctx.fill();

			ctx.font = "24px 'ＭＳ Ｐゴシック'";
			ctx.fillStyle = "#b00";
			ctx.fillText("press f5 to restart.", width/2 - 100, height/2+80);
			ctx.fill();

			$("#mytwitter textarea").text(" \"スコアは "+score+" 点でした #boids_sim http://tsujimotter.info/js_hack/boids/ \"");
			$("#mytwitter").show("slow");

    		//canvasの状態を元に戻す
    		ctx.restore();
		}
	}


	// 当たり判定処理
	function collisionDetection() {

		// 当たり判定
		boids.forEach( function(boid){
			enemies.forEach( function(enemy){
				var dist = (boid.x-enemy.x)*(boid.x-enemy.x) + (boid.y-enemy.y)*(boid.y-enemy.y);
				if( dist < enemy.radious*enemy.radious ){
					boid.alive = false;
				}
			});
		});

		// 全個体が死んだらゲームオーバー
		var aliveCount = 0;
		boids.forEach( function(boid){
			if( boid.alive ){
				aliveCount++;
			}
		});

		numOfBoidsRemaining = aliveCount;

		if( aliveCount <= 0 ) {
			gameContextFlag = GAME_CONTEXT_FLAG_GAMEOVER;
		}
	}

	function draw(){

		var ctx = getCtx();

		// boid の描画
		boids.forEach( function(boid){
			boid.draw(ctx);
		});

		// 敵キャラの描画
		enemies.forEach( function(enemy){
			enemy.draw(ctx);
		});

		// target の描画
		target.draw(ctx);
	}

	function update(){
		boids.forEach( function(boid){
			boid.update();
		});

		enemies.forEach( function(enemy){
			enemy.update();
		} );

	}

});
