$(function() {
	//画像オブジェクトに任意の画像を読み込み
	var boid_img = new Image();
	//画像のパス指定
	boid_img.src = "images/boid.png";


	//画像オブジェクトに任意の画像を読み込み
	var enemy_img = new Image();
	//画像のパス指定
	enemy_img.src = "images/enemy.png";


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
	enemies[0] = {
		x: 100,
		y: 100,
		radious: 60
	};
	enemies[1] = {
		x: 500,
		y: 400,
		radious: 60
	};


	var target = {
		x: width/2,
		y: height*4/5
	};

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

/*
	var Boid = (function(){

		function Boid(id, x, y, vx, vy) {
			this.id = id;
			this.x  = x;
			this.y  = y;
			this.vx = vx;
			this.vy = vy;
		}

		Boid.prototype.rule1 = function(){
			var cx = 0;
			var cy = 0;
			
			for( var j = 0; j < numOfBoids; j++ ){
				if( i != j ){
					cx += boids[ j ].x;
					cy += boids[ j ].y;
				}
			}
			cx /= numOfBoids - 1;
			cy /= numOfBoids - 1;

			this.vx += ( cx - this.x ) / 1000;
			this.vy += ( cy - this.y ) / 1000;
		}

		return Boid;
	})();
*/

	// 初期処理
	for(var i=0; i<numOfBoids; i++){
		boids[i] = {
			x: width/2,
			y: height/2,
			vx: 0,
			vy: 0,
			alive: true
		};
	}

	var Boids = {
		rule1: function(i){ // すべてのBoidは群の中心に向かおうとする

			var cx = 0;
			var cy = 0;
			
			var aliveCount = 0;  // 生きている boid の数を数える

			for( var j = 0; j < numOfBoids; j++ ){
				if( i != j ){

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

				boids[ i ].vx += ( cx - boids[ i ].x ) / 1000;
				boids[ i ].vy += ( cy - boids[ i ].y ) / 1000;

			}

		},
		rule2: function(i){ // 他の個体と距離をとろうとする
			var vx = 0;
			var vy = 0;

			for( var j = i + 1; j < numOfBoids; j++ ){

				if( boids[j].alive ){

					var dx = boids[ j ].x - boids[ i ].x;
					var dy = boids[ j ].y - boids[ i ].y;

					var dist = Math.sqrt( dx * dx + dy * dy );
					if( dist < 15 ){
						dist += 0.001;

						vx -= dx / dist;
						vy -= dy / dist;
					}

				}
			}

			boids[ i ].vx += vx;
			boids[ i ].vy += vy;

		},
		rule3: function(i){ // 他の個体と向きと速度を合わせようとする
			var pvx = 0;
			var pvy = 0;

			var aliveCount = 0;  // 生きている boids の数

			for( var j = 0; j < numOfBoids; j++ ){
				if( i != j ){

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

				boids[ i ].vx += ( pvx - boids[ i ].vx ) / 10;
	  			boids[ i ].vy += ( pvy - boids[ i ].vy ) / 10;
			}
			
		},
		rule4: function(i){ // 移動領域を限定する

			// 壁の近くでは方向反転
			if( boids[i].x < 10 && boids[ i ].vx < 0 ){
				boids[i].vx += 10 / ( Math.abs( boids[i].x  ) + 1 );
			} 
			else if( boids[i].x > width - 10 && boids[i].vx > 0 ){
				boids[i].vx -= 10 / ( Math.abs( width - boids[i].x ) + 1 );
			}

			if( boids[i].y < 10 && boids[i].vy < 0 ){
				boids[i].vy += 10 / ( Math.abs( boids[i].y  ) + 1 );
			}
			else if( boids[i].y > height - 10 && boids[i].vy > 0 ){
				boids[i].vy -= 10 / ( Math.abs( height - boids[i].y ) + 1 );
			}
  
		},
		rule5: function(i){
			var dx = target.x - boids[ i ].x;
			var dy = target.y - boids[ i ].y;

			var dist = Math.sqrt( dx * dx + dy * dy );

			boids[ i ].vx += ( target.x - boids[ i ].x ) / 500;
			if( boids[ i ].vx * ( target.x - boids[ i ].x ) < 0 ){
				boids[ i ].vx += ( target.x - boids[ i ].x ) / 500;
			}
			boids[ i ].vy += ( target.y - boids[ i ].y ) / 500;
			if( boids[ i ].vy * ( target.y - boids[ i ].y ) < 0 ){
				boids[ i ].vy += ( target.y - boids[ i ].y ) / 500;
			}
		}
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
				enemies.push({
					x: width*Math.random(),
					y: width*Math.random(),
					radious: 60
				});
				appearingEnemy = 0;
			}
			setTimeout( main, 20 );			

		}
		else if( gameContextFlag == GAME_CONTEXT_FLAG_GAMEOVER ) {

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

			ctx.fillStyle = 'rgba(192, 80, 77, 0.7)';

			$("#mytwitter textarea").text(" \"スコアは "+score+" 点でした #boids_sim http://tsujimotter.info/js_hack/boids/ \"");
			$("#mytwitter").show("slow");
		}
	}


	// とりあえずの変数
	//var collisionTimer = 0;

	// 当たり判定処理
	function collisionDetection() {

/*
		boids[collisionTimer] = false;
		collisionTimer++;
*/
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

	// とりあえずの変数
	var deg = 0;


	function draw(){
		deg++;

		var ctx = getCtx();

		// boid の描画
		boids.forEach( function(boid){
			if( boid.alive ){
				drawBoid(ctx, boid.x, boid.y, boid.vx, boid.vy, 18);
				//fillOval(ctx, boid.x, boid.y, 6, 'rgba(192, 80, 77, 0.7)');

			} 
		});

		// 敵キャラの描画
		enemies.forEach( function(enemy){
			drawEnemy(ctx, enemy.x, enemy.y, enemy.radious);
			//fillOval(ctx, enemy.x, enemy.y, enemy.radious, 'rgba(30, 192, 77, 0.7)');
		});

		// target の描画
		fillOval(ctx, target.x, target.y, 20, 'rgba(0, 80, 192, 0.7)');
	}


	function drawBoid(ctx, x, y, vx, vy, width){

		var rad = Math.atan2(vy, vx);

    	//canvasの状態を一旦保存
    	ctx.save();

    	var image_width  = boid_img.naturalWidth;
    	var image_height = boid_img.naturalHeight;
    	
    	//ctx.scale(ratio, ratio);
	    //画像の縦横半分の位置へtranslate
	    ctx.translate(x-image_width/2 + image_width/2, y- image_height/2 +image_height/2);
	    //変形マトリックスに回転を適用
	    ctx.rotate(rad);

		//translateした分戻して原点を0，0に
	    ctx.translate(-image_width/2, -image_height/2);

	    //読み込んだimgをcanvas(c1)に貼付け
	    ctx.drawImage(boid_img, 0, 0);
    	//canvasの状態を元に戻す
    	ctx.restore();
	}


	function drawEnemy(ctx, x, y, width){

    	//canvasの状態を一旦保存
    	ctx.save();

    	var image_width  = enemy_img.naturalWidth;
    	var image_height = enemy_img.naturalHeight;
    	
    	//ctx.scale(ratio, ratio);
	    //画像の縦横半分の位置へtranslate
	    ctx.translate(x-image_width/2 + image_width/2, y- image_height/2 +image_height/2);
		//translateした分戻して原点を0，0に
	    ctx.translate(-image_width/2, -image_height/2);

	    //読み込んだimgをcanvas(c1)に貼付け
	    ctx.drawImage(enemy_img, 0, 0);
    	//canvasの状態を元に戻す
    	ctx.restore();
	}


	function update(){
		for(var i=0; i<numOfBoids; i++){

			if( boids[i].alive ){
				Boids.rule1(i);
				Boids.rule2(i);
				Boids.rule3(i);
				Boids.rule4(i);
				Boids.rule5(i);
			
				// 速さを制限する
		    	var l = Math.sqrt( boids[ i ].vx * boids[ i ].vx + boids[ i ].vy * boids[ i ].vy );
		    	if( l > MAXSPEED ){
		    		boids[ i ].vx *= MAXSPEED / l;
		    		boids[ i ].vy *= MAXSPEED / l; 
		    	}

			    // 位置の更新
			    boids[ i ].x += boids[ i ].vx;
			    boids[ i ].y += boids[ i ].vy;
			}
		}

		enemies.forEach( function(enemy){
			var dx = Math.random()*40 - 20;
			var dy = Math.random()*40 - 20;

			if( enemy.x+dx > 0 && enemy.x+dx < width 
				&& enemy.y+dy > 0 && enemy.y+dy < height ){
				enemy.x += dx;
				enemy.y += dy;
				
			}

		} );

	}


	// 円を描く
	function fillOval(ctx, x, y, radious, fillStyle){
		ctx.fillStyle = fillStyle;
		ctx.beginPath();
		ctx.arc(x, y, radious, 0, Math.PI*2, false);
		ctx.fill();	
	}

});
